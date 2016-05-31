#!/bin/bash
COMMIT=$( node scripts/details.js COMMIT )
PACKAGE_VERSION=$( node scripts/details.js VERSION )
PACKAGE_NAME=$( node scripts/details.js NAME )
OS=$( node scripts/details.js OS )
FILE_NAME=$PACKAGE_NAME-$PACKAGE_VERSION-$COMMIT-$OS

# Clean the build directory
rm -rf build
mkdir build
mkdir build/$PACKAGE_VERSION

# Do a git archive and a production install
# to have cleanest output
git archive --format=zip $COMMIT -o ./build/$PACKAGE_VERSION/temp.zip
cd build/$PACKAGE_VERSION
unzip temp.zip -d $PACKAGE_NAME

cd $PACKAGE_NAME
npm install --production
echo 'Installed NPM Dependencies'

if [ $OS == 'darwin' ]; then
	zip -r ../$FILE_NAME.zip .
else
	tar czf ../$FILE_NAME.tar.gz .
fi

cd ..
rm -rf $PACKAGE_NAME temp.zip
echo 'Done'