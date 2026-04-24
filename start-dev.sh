#!/bin/bash
export PATH="/Users/itishree/.nvm/versions/node/v20.20.2/bin:$PATH"
exec next dev -p ${PORT:-3001}
