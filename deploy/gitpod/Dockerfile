FROM gitpod/workspace-full

USER root

RUN export DEBIAN_FRONTEND='noninteractive' \
    && apt-get update \
    && apt-get install -y \
        netcat \
        mlocate \
        build-essential \
        gettext \
        fzf \
        sshfs \
        tldr \
    && rm -rf /var/lib/apt/lists/*

RUN export TMPDIR=$(mktemp -d); export VERSION="3.96"; export FNAME="upx-${VERSION}-amd64_linux" \
    ; wget --directory-prefix=$TMPDIR https://github.com/upx/upx/releases/download/v${VERSION}/${FNAME}.tar.xz \
    ; (cd $TMPDIR \
        && xz --decompress ${FNAME}.tar.xz \
        && tar xvf ${FNAME}.tar \
        && sudo install ${FNAME}/upx /usr/local/bin/ ) \
    ; rm -rf $TMPDIR


USER gitpod

RUN wget https://github.com/neovim/neovim/releases/download/v0.7.2/nvim-linux64.deb \
    && sudo dpkg -i nvim-linux64.deb \
    && rm nvim-linux64.deb

RUN npm install -g @ionic/cli native-run cordova-res

RUN mkdir -p /home/gitpod/.bashrc.d

COPY ./deploy/gitpod/gitpod.bashrc /home/gitpod/.bashrc.d/98-gitpod-bashrc
