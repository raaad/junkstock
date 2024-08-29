FROM nginxinc/nginx-unprivileged:alpine
COPY --chown=1000:0 dist/{APP} /tmp/app
ADD devops/docker-nginx.conf /etc/nginx/conf.d/default.conf
# replace environment values at startup
COPY devops/docker-entrypoint.sh /tmp/
CMD ["sh", "/tmp/docker-entrypoint.sh"]
