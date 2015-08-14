# Dockerfile to create a docker image
# Base image
FROM node

# Add files to the image
RUN mkdir -p /opt/nodejs
ADD . /opt/nodejs
WORKDIR /opt/nodejs

# Install the dependencies modules
RUN npm install
# Expose the container port
EXPOSE 3000

#ENTRYPOINT ["node", "app.js"]
ENTRYPOINT ["node","-trace_gc","-expose-gc","app.js"]