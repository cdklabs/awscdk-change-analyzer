# Generates and exports change report to fe/model-diff-example.json
# Considering there is a ""../experiment templates" folder with different subfolders containing before.json, after.json and rules.json
npm start -- \
 "../../experiment templates/$1/before.json" \
 "../../experiment templates/$1/after.json" \
 "../../experiment templates/$1/rules.json" \
 "../web-app/model-diff-example.json"