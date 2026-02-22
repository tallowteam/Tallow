class Tallow < Formula
  desc "The most secure peer-to-peer file transfer CLI tool"
  homepage "https://github.com/tallowteam/Tallow"
  version "0.1.0"
  license "AGPL-3.0-or-later"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/tallowteam/Tallow/releases/download/v#{version}/tallow-v#{version}-aarch64-apple-darwin.tar.gz"
      sha256 "87007fd2e5887b50a6a80ddf2bc2cf4916fc91cdae48cd972a9d14c4541f3d7f"
    else
      url "https://github.com/tallowteam/Tallow/releases/download/v#{version}/tallow-v#{version}-x86_64-apple-darwin.tar.gz"
      sha256 "eb4bcbdd1bbd1210c4ba54d70de351b193d528877d688727f3bef46e27afb373"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/tallowteam/Tallow/releases/download/v#{version}/tallow-v#{version}-aarch64-unknown-linux-gnu.tar.gz"
      sha256 "dbb43136a8af17d5fc6a2b0f349e76bab72b6f43a00a59930931a6e3945c5e8f"
    else
      url "https://github.com/tallowteam/Tallow/releases/download/v#{version}/tallow-v#{version}-x86_64-unknown-linux-gnu.tar.gz"
      sha256 "90f6221a2fcfc8f405d86ae21feb28842c8b63f384c9be526445226ed90dc733"
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
