FROM oven/bun:latest
WORKDIR /app

# Install Chrome dependencies and additional tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    dnsutils curl wget procps ffmpeg psmisc \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    dbus-x11 \
    xvfb \
    xdg-utils && \
    rm -rf /var/lib/apt/lists/*

# Install Chrome
RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    dpkg -i google-chrome-stable_current_amd64.deb || apt-get -f install -y && \
    rm google-chrome-stable_current_amd64.deb

# Set up environment variables
ENV CHROME_PATH=/usr/bin/google-chrome
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FLUENTFFMPEG_COV=0
ENV DISPLAY=:99
ENV HEADLESS=true

# Create a script to start dbus and xvfb
RUN echo '#!/bin/bash\n\
# Start dbus\n\
service dbus start\n\
# Start Xvfb\n\
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &\n\
# Execute the main command\n\
exec "$@"' > /usr/local/bin/start-services.sh && \
    chmod +x /usr/local/bin/start-services.sh

COPY . .
RUN bun install
RUN bun run build
ENV DATA_PATH=/app/data
RUN mkdir -p $DATA_PATH

# Use the start script as entrypoint
ENTRYPOINT ["/usr/local/bin/start-services.sh"]
CMD ["bun", "run", "start"]