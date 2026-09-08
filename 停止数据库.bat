@echo off
REM Stop PostgreSQL service
echo Stopping PostgreSQL...
"D:\study\postgres\pgsql\bin\pg_ctl.exe" -D "D:\study\postgres\pgdata" stop -m fast
echo Done.
pause
