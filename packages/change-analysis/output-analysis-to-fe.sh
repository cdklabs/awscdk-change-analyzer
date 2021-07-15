# Generates and exports change report to web-app/model-diff-example.json
# Considering there is a ""../templates" folder with different subfolders containing before.json, after.json and rules.json
node out/index.js \
 "../../templates/$1/before.json" \
 "../../templates/$1/after.json" \
 "../../templates/$1/rules.json" \
 "../web-app/model-diff-example.json"