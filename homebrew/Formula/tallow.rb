class Tallow < Formula
  desc "The most secure peer-to-peer file transfer CLI tool"
  homepage "https://github.com/tallowteam/Tallow"
  version "0.1.0"
  license "AGPL-3.0-or-later"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/tallowteam/Tallow/releases/download/v#{version}/tallow-v#{version}-aarch64-apple-darwin.tar.gz"
      sha256 "6de3afa3c7640aacda4e18d272bee9460c9a666be078b4211b16973fc008ff9d"
    else
      url "https://github.com/tallowteam/Tallow/releases/download/v#{version}/tallow-v#{version}-x86_64-apple-darwin.tar.gz"
      sha256 "fea8d6d9d65032581ef9dbc5dda837fcc6c7c9de33558c84fb88fb95d3c00d42"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/tallowteam/Tallow/releases/download/v#{version}/tallow-v#{version}-aarch64-unknown-linux-gnu.tar.gz"
      sha256 "991fb6b71897470cc08a8ad4357afed753c1ee28cce38e4a720d141a07ec005c"
    else
      url "https://github.com/tallowteam/Tallow/releases/download/v#{version}/tallow-v#{version}-x86_64-unknown-linux-gnu.tar.gz"
      sha256 "3aa207022cf1a08b578c83499b58ad64cf46d71b49c618fbb0fafec0f4f90ca9"
    end
  end

  def install
    bin.install "tallow"
    bin.install "tallow-relay" if File.exist?("tallow-relay")
  end

  test do
    assert_match "tallow #{version}", shell_output("#{bin}/tallow version")
  end
end
