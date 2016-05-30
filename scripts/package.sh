#!/bin/bash
COMMIT=$( node scripts/details.js COMMIT )
PACKAGE_VERSION=$( node scripts/details.js VERSION )
PACKAGE_NAME=$( node scripts/details.js NAME )
FILE_NAME=$PACKAGE_NAME-$PACKAGE_VERSION-$COMMIT-$OSTYPE

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
tar czf ../$FILE_NAME.tar.gz .

cd ..
rm -rf $PACKAGE_NAME temp.zip
echo 'Done'