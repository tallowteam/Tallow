class Tallow < Formula
  desc "The most secure peer-to-peer file transfer CLI tool"
  homepage "https://github.com/tallowteam/Tallow"
  version "0.1.0"
  license "AGPL-3.0-or-later"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/tallowteam/Tallow/releases/download/v#{version}/tallow-v#{version}-aarch64-apple-darwin.tar.gz"
      sha256 "PLACEHOLDER_AARCH64_DARWIN_SHA256"
    else
      url "https://github.com/tallowteam/Tallow/releases/download/v#{version}/tallow-v#{version}-x86_64-apple-darwin.tar.gz"
      sha256 "PLACEHOLDER_X86_64_DARWIN_SHA256"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/tallowteam/Tallow/releases/download/v#{version}/tallow-v#{version}-aarch64-unknown-linux-gnu.tar.gz"
      sha256 "PLACEHOLDER_AARCH64_LINUX_SHA256"
    else
      url "https://github.com/tallowteam/Tallow/releases/download/v#{version}/tallow-v#{version}-x86_64-unknown-linux-gnu.tar.gz"
      sha256 "PLACEHOLDER_X86_64_LINUX_SHA256"
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
