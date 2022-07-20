FROM golang:1.17-buster
ENV DIST_UID=

RUN export DEBIAN_FRONTEND='noninteractive' \
    && apt-get update \
    && apt-get install -y \
        xz-utils \
    && rm -rf /var/lib/apt/lists/*

RUN export TMPDIR=$(mktemp -d); export VERSION="3.96"; export FNAME="upx-${VERSION}-amd64_linux" \
    ; wget --directory-prefix=$TMPDIR https://github.com/upx/upx/releases/download/v${VERSION}/${FNAME}.tar.xz \
    ; (cd $TMPDIR \
        && xz --decompress ${FNAME}.tar.xz \
        && tar xvf ${FNAME}.tar \
        && install ${FNAME}/upx /usr/local/bin/ ) \
    ; rm -rf $TMPDIR


VOLUME [ "/go/src/app" ]
WORKDIR /go/src/app

CMD ["./build-prod-docker-cmd.sh"]