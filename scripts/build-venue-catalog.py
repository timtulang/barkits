"""Build Barkits' offline venue index from HOT's Philippine POI GeoPackage."""
import collections
import json
import math
from pathlib import Path
import sqlite3
import sys

# https://data.humdata.org/dataset/hotosm_phl_points_of_interest
db = sqlite3.connect(f"file:{Path(sys.argv[1]).resolve()}?mode=ro", uri=True)
rows = db.execute("""
select p.id, trim(name), coalesce(addr_city, adm3_name, adm2_name, ''), amenity, shop, tourism,
       (miny+maxy)/2, (minx+maxx)/2, addr_street, adm4_name
from points_of_interest p join rtree_points_of_interest_geom r on p.fid=r.id
where trim(name) != '' and (amenity in ('restaurant','cafe','food_court','bus_station','ferry_terminal','university','college','hospital')
  or shop='mall' or tourism='museum')
order by p.id
""").fetchall()
terminals = collections.defaultdict(list)
for _, name, _, amenity, _, _, lat, lng, _, _ in rows:
    if amenity == 'bus_station':
        terminals[math.floor(lat*100), math.floor(lng*100)].append((lat, lng))
search_types = {
    'bus_station': 'Bus terminal', 'ferry_terminal': 'Ferry terminal',
    'university': 'University', 'college': 'College', 'hospital': 'Hospital',
}
catalog = []
extra_places = []
for osm_id, name, city, amenity, shop, tourism, lat, lng, street, barangay in rows:
    address = ', '.join(dict.fromkeys(part for part in (street, barangay) if part and part != city))
    if amenity in search_types and shop != 'mall' and tourism != 'museum':
        extra_places.append([osm_id, name, city, search_types[amenity], round(lat,5), round(lng,5), 0, address])
        continue
    category = 'Mall' if shop == 'mall' else 'Museum' if tourism == 'museum' else 'Café' if amenity == 'cafe' else 'Restaurant'
    # local tangent-plane approximation at sub-kilometer scale
    y, x = math.floor(lat*100), math.floor(lng*100)
    nearby = any(math.hypot((lat-a)*111.2, (lng-b)*111.2*math.cos(math.radians(lat))) <= 0.8
                 for dy in (-1,0,1) for dx in (-1,0,1)
                 for a,b in terminals[y+dy,x+dx])
    catalog.append([osm_id, name, city, category, round(lat,5), round(lng,5), int(nearby), address])
data_dir = Path(__file__).resolve().parents[1] / 'assets/data'
for filename, records in [('ph-venues.json', catalog), ('ph-landmarks.json', extra_places)]:
    (data_dir / filename).write_text(json.dumps(records, ensure_ascii=False, separators=(',', ':'))+'\n')
    print(f'{filename}: {len(records)} places')
