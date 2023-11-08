#!/bin/bash
set -e
cd "`dirname $0`"/..
cargo build --all --target wasm32-unknown-unknown --release
pwd
cp target/wasm32-unknown-unknown/release/*.wasm ./res/

near deploy obrigado.testnet ./res/obrigado_is_near.wasm
