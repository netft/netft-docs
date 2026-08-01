---
sidebar_position: 2
---

# Installation

Choose one interface for the first connection. The CLI is the recommended commissioning tool because it can inspect configuration and run a bounded health check without a GUI, programming environment, or ROS graph.

## Supported releases

| Interface      | Stable release | Preferred install                   | Platforms                                  |
| -------------- | -------------- | ----------------------------------- | ------------------------------------------ |
| Net F/T CLI    | 0.2.0          | GitHub release executable           | Linux, macOS, Windows                      |
| Net F/T Viewer | 0.1.0          | GitHub release installer or archive | Linux, macOS, Windows                      |
| netft-cpp      | 0.3.3          | CMake source build                  | Linux, macOS, Windows                      |
| pyNetFT        | 2.1.0          | PyPI wheel                          | CPython 3.10–3.14 on Linux, macOS, Windows |
| ros-netft      | 0.3.2          | ROS workspace source build          | Supported ROS environments on Linux        |

Check the [compatibility reference](../references/compatibility.mdx) before installing a later release.

## CLI

Download an archive from [Net F/T CLI releases](https://github.com/netft/netft-cli/releases), or use the maintained installer.

Linux and macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/netft/netft-cli/main/scripts/install/install.sh | sh
```

Windows PowerShell:

```powershell
irm https://raw.githubusercontent.com/netft/netft-cli/main/scripts/install/install.ps1 | iex
```

Release executables include the private protocol core and curl runtime. Verify the installed command:

```bash
netft --version
netft --help
```

## Viewer

Download the installer or portable archive from [Net F/T Viewer releases](https://github.com/netft/netft-viewer/releases). Linux releases provide `.deb` and portable archives for x86_64 and ARM64. Windows provides an x86_64 installer and portable archive. macOS provides universal Intel/Apple silicon disk images and archives.

No ROS installation is needed. The application is self-contained; host firewall rules must still permit HTTP configuration traffic and UDP measurement replies.

## Python

Install the supported wheel:

```bash
python -m pip install pynetft==2.1.0
python -c "import pynetft; print(pynetft.__version__)"
```

Wheels include the native core and required curl implementation, so users do not install curl separately. A source build needs a C++17 compiler, CMake 3.16 or newer, and libcurl 7.63 or newer.

## C++

Build and install netft-cpp with CMake:

```bash
git clone --branch v0.3.3 https://github.com/netft/netft-cpp.git
cd netft-cpp
cmake -S . -B build/release \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_SHARED_LIBS=ON \
  -DBUILD_TESTING=OFF \
  -DCMAKE_INSTALL_PREFIX="$PWD/install"
cmake --build build/release
cmake --install build/release
```

Use `BUILD_SHARED_LIBS=OFF` for a static library. Consumers use the installed `netft::netft` CMake target.

## ROS 2

Replace `lyrical` with another supported distribution when required:

```bash
source /opt/ros/lyrical/setup.bash
mkdir -p ~/netft_ws/src
git clone --branch 0.3.2 https://github.com/netft/ros-netft.git \
  ~/netft_ws/src/netft_driver
cd ~/netft_ws
rosdep install --from-paths src --ignore-src -r -y
colcon build --packages-select netft_driver
source install/setup.bash
```

The repository is `ros-netft`; the ROS package is `netft_driver`. Do not assume a binary package exists for a distribution until it appears in that distribution's package index.

## Source-build prerequisites

The CLI, Viewer, C++ SDK, and Python source build share the same native requirements: CMake 3.16+, C++17, threads, and libcurl 7.63+. Repository Pixi environments are contributor tools, not end-user installation requirements.
