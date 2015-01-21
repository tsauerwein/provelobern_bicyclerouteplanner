Create osm import style by setting everything to deleted and only keep bridges? and highway?


osm2pgsql --slim --drop --latlong -r pbf -S osm_import_style -d osm -c  liechtenstein-latest.osm.pbf



Retrieve the altitude of a given OSM node
select ST_X(way), ST_Y(way) from swiss_srtm, planet_osm_point where planet_osm_point.osm_id = 669855777 and ST_Intersects(rast, way)  limit 3;

Retrieve a set of altitude:
select osm_id, ST_X(way), ST_Y(way) from swiss_srtm, planet_osm_point where planet_osm_point.osm_id in ('669855777', '2869805536', '2142407666') and ST_Intersects(rast, way);
