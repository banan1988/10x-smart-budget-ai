#!/bin/zsh

# Rancher Desktop supabase workaround
# 1. Check docker - docker context ls
# NAME                DESCRIPTION                               DOCKER ENDPOINT                          ERROR
# default             Current DOCKER_HOST based configuration   unix:///var/run/docker.sock
# rancher-desktop *   Rancher Desktop moby context              unix:///Users/your-username/.rd/docker.sock
# 2. If the current context is rancher-desktop, switch to default
# docker context use default
# 3. Create a symlink for docker.sock (you might need sudo)
# sudo ln -s $HOME/.rd/docker.sock /var/run/docker.sock
# 4. Run this script to restart supabase
# bash supabase.sh restart

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

reset() {
  supabase db reset --local
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
  reset)
    reset
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|reset}"
    exit 1
    ;;
esac
