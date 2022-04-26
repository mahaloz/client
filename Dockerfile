from golang:1.17 as builder

#RUN git clone https://github.com/keybase/client.git
COPY . /go/client

RUN apt update && apt install clang -y

# install source of target
RUN mkdir ~/gopath && \
    export GOPATH="$HOME/gopath" && \
    export PATH="$PATH:$GOPATH/bin" && \
    export PATH="$PATH:$GOPATH/bin" && \
    cd client/go && \
    go install -tags production github.com/keybase/client/go/keybase && \
    go get github.com/dvyukov/go-fuzz/go-fuzz github.com/dvyukov/go-fuzz/go-fuzz-build && \
    cd fuzz/nacl_enc && \
    go-fuzz-build -libfuzzer -o fuzz_keybase_nacl_enc.a . && \
    clang -fsanitize=fuzzer fuzz_keybase_nacl_enc.a  -o fuzz_keybase_nacl_enc && \
    cp fuzz_keybase_nacl_enc /fuzz_keybase_nacl_enc

FROM golang:1.17
COPY --from=builder /fuzz_keybase_nacl_enc /
