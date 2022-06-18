#!/usr/bin/env bash

cd src && watchmedo auto-restart --recursive --pattern="*.py" --directory="." python3 jobs_handler.py