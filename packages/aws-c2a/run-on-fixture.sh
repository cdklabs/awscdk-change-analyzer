#!/bin/bash
set -euo pipefail

function heading {
  printf "\e[38;5;81m$@\e[0m\n"
}

function success {
  printf "\e[32;5;81m$@\e[0m\n"
}

function error {
  printf "\e[91;5;81m$@\e[0m\n"
}

if [ "$#" -eq 0 ]; then
  error "Please supply a fixture name diff."
fi

FIXTURE=$1

heading "Running aws-c2a diff on $FIXTURE"
heading "--------------------------------------"
bin/aws-c2a diff --app test/fixtures/$FIXTURE --rules-path test/fixtures/$FIXTURE/rules.json --fail-condition HIGH --out test/fixtures/$FIXTURE/report.json 
diff test/fixtures/$FIXTURE/change-report.json test/fixtures/$FIXTURE/report.json
EXIT_CODE=$?
heading "--------------------------------------"

if [ $EXIT_CODE -eq 0 ]; then
  success "Fixture report matches snapshot."
else
  error "Fixture report does not match snapshot."
fi