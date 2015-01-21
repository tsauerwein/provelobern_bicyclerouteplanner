#!/bin/sh

# Eventually update the profiles directory then launch script.
# All profile networks will be generated.
# If all went well, the data in /var/sig/osrm will be overwritten.
# Then the osrm-routed daemons must be restarted.

NOW=`date '+%Y_%m_%d_%Hh'`
OSMFILE='switzerland-padded.osm'
#PROFILES='upstream fast quiet ebike'
PROFILES='upstream'

set -o errexit

cleanup() {
  echo 'ERROR, cleaning up'
  rm -f /tmp/stxxl
}
trap "cleanup" INT TERM EXIT


mkdir -p $NOW

cd $NOW
echo "Moving to `pwd` directory"

\cp -Rf ../profiles .


# Download osm data
if [ ! -e $OSMFILE.pbf ]
then
	echo "Downloading hourly updated data for Switzerland and neighbouring cities to $OSMFILE.pbf"
	wget http://planet.osm.ch/$OSMFILE.pbf
else
	echo "Skipped download of osm data to $OSMFILE.pbf"
fi

# Uncompress since osrm runs out of memory when using the pbf file directly
if [ ! -e $OSMFILE ]
then
	echo "Uncompressing $OSMFILE.pbf to $OSMFILE"
	osmosis --read-pbf file="$OSMFILE.pbf" --write-xml file="$OSMFILE"
else
	echo "Skipping uncompression to $OSMFILE"
fi


for profile in $PROFILES
do
	mkdir -p $profile
	cd $profile

	cat ../profiles/$profile.lua > $profile.lua
	ln -fs ../profiles/lib
	ln -fs ../$OSMFILE $profile.osm

	# Extract with profile
	echo "Extracting data with profile $profile"
	STXXLCFG=../../.stxxl osrm-extract $profile.osm -p $profile.lua

	# Prepare
	echo "Preparing network $profile"
	STXXLCFG=../../.stxxl osrm-prepare $profile.osrm -p $profile.lua

	rm -f $profile.osm
	rm -f $profile.osrm
	rm -f lib
	cd ..
done

echo "Cleaning $OSMFILE and /tmp/stxxl"
rm -f $OSMFILE
rm -f /tmp/stxxl

echo "Updating production networks in /var/sig/osrm/"
mkdir -p /var/sig/osrm/
for profile in $PROFILES
do
	\cp -Rf $profile /var/sig/osrm/
done

echo "Restarting daemons for each profile"
for profile in $PROFILES
do
	sudo /etc/init.d/osrm-$profile restart
done


