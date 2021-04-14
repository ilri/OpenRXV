#!/bin/sh
cd /frontend && npm i && ng b --prod --base-href=/explorer/
nginx -g"daemon off;"

