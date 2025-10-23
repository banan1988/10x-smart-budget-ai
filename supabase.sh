#!/bin/zsh

# Rancher Desktop supabase workaround
# 1. Check docker - docker context ls
# NAME                DESCRIPTION                               DOCKER ENDPOINT                          ERROR
# default             Current DOCKER_HOST based configuration   unix:///var/run/docker.sock
# rancher-desktop *   Rancher Desktop moby context              unix:///Users/your-username/.rd/docker.sock
# 2. If the current context is rancher-desktop, switch to default - docker context use default
# 3. Run this script to restart supabase

restart() {
  supabase stop supabase_vector_10x-smart-budget-ai
  docker rm -f supabase_vector_10x-smart-budget-ai
  supabase start
}

start() {
  supabase start
}

stop() {
  supabase stop
}

case $1 in
  restart)
    restart
    ;;
  start)
    start
    ;;
  stop)
    stop
    ;;
  *)
    echo "Usage: $0 {start|stop|restart}"
    exit 1
    ;;
esac
