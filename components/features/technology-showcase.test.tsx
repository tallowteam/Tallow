/**
 * TechnologyShowcase Component Tests
 *
 * Tests for the TechnologyShowcase component including rendering,
 * accessibility, interactions, and responsive behavior.
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
// import userEvent from "@testing-library/user-event";
import {
  TechnologyShowcase,
  Technology,
  DEFAULT_TECHNOLOGIES,
} from "./technology-showcase";

describe("TechnologyShowcase", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<TechnologyShowcase />);
      expect(screen.getByRole("region")).toBeInTheDocument();
    });

    it("renders default technologies when no props provided", () => {
      render(<TechnologyShowcase />);
      const cards = screen.getAllByRole("article");
      expect(cards).toHaveLength(DEFAULT_TECHNOLOGIES.length);
    });

    it("renders section header with correct text", () => {
      render(<TechnologyShowcase />);
      expect(screen.getByText("Cutting-Edge Technology")).toBeInTheDocument();
      expect(
        screen.getByText(/Powered by the latest advancements/i)
      ).toBeInTheDocument();
    });

    it("renders all default technology names", () => {
      render(<TechnologyShowcase />);
      expect(screen.getByText("ML-KEM-768 (Kyber)")).toBeInTheDocument();
      expect(screen.getByText("Triple Ratchet Protocol")).toBeInTheDocument();
      expect(screen.getByText("WebRTC DataChannels")).toBeInTheDocument();
    });

    it("renders custom technologies when provided", () => {
      const customTechnologies: Technology[] = [
        {
          id: "test-tech",
          icon: "Zap",
          name: "Test Technology",
          description: "Test description",
          why: "Test why",
          link: "/test",
        },
      ];

      render(<TechnologyShowcase technologies={customTechnologies} />);
      expect(screen.getByText("Test Technology")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
      expect(screen.getByText("Test why")).toBeInTheDocument();
    });

    it("renders large icons for each technology", () => {
      render(<TechnologyShowcase />);
      const cards = screen.getAllByRole("article");
      cards.forEach((card) => {
        const icon = within(card).getByRole("presentation", { hidden: true });
        expect(icon).toBeInTheDocument();
      });
    });

    it("renders 'Why This Matters' section for each card", () => {
      render(<TechnologyShowcase />);
      const whyLabels = screen.getAllByText("Why This Matters");
      expect(whyLabels).toHaveLength(DEFAULT_TECHNOLOGIES.length);
    });

    it("renders learn more links for each technology", () => {
      render(<TechnologyShowcase />);
      const learnMoreLinks = screen.getAllByText("Learn More");
      expect(learnMoreLinks).toHaveLength(DEFAULT_TECHNOLOGIES.length);
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels on section", () => {
      render(<TechnologyShowcase />);
      const section = screen.getByRole("region");
      expect(section).toHaveAttribute(
        "aria-labelledby",
        "technology-heading"
      );
    });

    it("has proper heading structure", () => {
      render(<TechnologyShowcase />);
      const mainHeading = screen.getByRole("heading", { level: 2 });
      expect(mainHeading).toHaveTextContent("Cutting-Edge Technology");
    });

    it("has unique IDs for each technology title", () => {
      render(<TechnologyShowcase />);
      const cards = screen.getAllByRole("article");

      cards.forEach((card) => {
        const heading = within(card).getByRole("heading", { level: 3 });
        expect(heading).toHaveAttribute("id");
        expect(heading.id).toMatch(/^tech-.*-title$/);
      });
    });

    it("has aria-hidden on decorative icons", () => {
      render(<TechnologyShowcase />);
      const cards = screen.getAllByRole("article");

      cards.forEach((card) => {
        const iconContainer = card.querySelector('[aria-hidden="true"]');
        expect(iconContainer).toBeInTheDocument();
      });
    });

    it("has accessible learn more links", () => {
      render(<TechnologyShowcase />);
      const learnMoreLinks = screen.getAllByRole("link", {
        name: /Learn more about/i,
      });
      expect(learnMoreLinks.length).toBeGreaterThan(0);
    });

    it("CTA buttons have proper labels", () => {
      render(<TechnologyShowcase />);
      expect(
        screen.getByRole("link", { name: /Security Documentation/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /How It Works/i })
      ).toBeInTheDocument();
    });
  });

  describe("Links and Navigation", () => {
    it("renders correct links for default technologies", () => {
      render(<TechnologyShowcase />);
      const securityLinks = screen.getAllByRole("link", {
        name: /Learn more about/i,
      });
      expect(securityLinks[0]).toHaveAttribute("href", "/security");
      expect(securityLinks[2]).toHaveAttribute("href", "/how-it-works");
    });

    it("renders custom links when provided", () => {
      const customTech: Technology[] = [
        {
          id: "test",
          icon: "Shield",
          name: "Test",
          description: "Desc",
          why: "Why",
          link: "/custom-link",
        },
      ];

      render(<TechnologyShowcase technologies={customTech} />);
      const link = screen.getByRole("link", { name: /Learn more about/i });
      expect(link).toHaveAttribute("href", "/custom-link");
    });

    it("CTA buttons link to correct pages", () => {
      render(<TechnologyShowcase />);
      const securityButton = screen.getByRole("link", {
        name: /Security Documentation/i,
      });
      const howItWorksButton = screen.getByRole("link", {
        name: /How It Works/i,
      });

      expect(securityButton).toHaveAttribute("href", "/security");
      expect(howItWorksButton).toHaveAttribute("href", "/how-it-works");
    });
  });

  describe("Styling", () => {
    it("applies custom className when provided", () => {
      const { container } = render(
        <TechnologyShowcase className="custom-class" />
      );
      const section = container.querySelector("section");
      expect(section).toHaveClass("custom-class");
    });

    it("has responsive grid classes", () => {
      const { container } = render(<TechnologyShowcase />);
      const grid = container.querySelector('[role="list"]');
      expect(grid).toHaveClass("grid");
      expect(grid).toHaveClass("grid-cols-1"); // Mobile
      expect(grid).toHaveClass("lg:grid-cols-3"); // Desktop
    });

    it("applies card-feature styling to cards", () => {
      const { container } = render(<TechnologyShowcase />);
      const firstCard = container.querySelector('[role="article"] > div');
      expect(firstCard).toHaveClass("card-feature");
    });

    it("has proper spacing between grid items", () => {
      const { container } = render(<TechnologyShowcase />);
      const grid = container.querySelector('[role="list"]');
      expect(grid).toHaveClass("gap-6");
      expect(grid).toHaveClass("lg:gap-8");
    });
  });

  describe("Content Validation", () => {
    it("renders technology descriptions", () => {
      render(<TechnologyShowcase />);
      expect(
        screen.getByText(/NIST-standardized quantum-resistant encryption/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Combined classical and post-quantum key rotation/i)
      ).toBeInTheDocument();
    });

    it("renders why sections correctly", () => {
      render(<TechnologyShowcase />);
      expect(
        screen.getByText(/Your files stay secure even in a post-quantum world/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Past messages remain secure even if future keys are compromised/i
        )
      ).toBeInTheDocument();
    });

    it("displays icons with correct size classes", () => {
      const { container } = render(<TechnologyShowcase />);
      const icons = container.querySelectorAll('[aria-hidden="true"] svg');
      icons.forEach((icon) => {
        expect(icon).toHaveClass("size-12");
      });
    });
  });

  describe("CTA Section", () => {
    it("renders CTA section with prompt text", () => {
      render(<TechnologyShowcase />);
      expect(
        screen.getByText(/Want to dive deeper into our security architecture/i)
      ).toBeInTheDocument();
    });

    it("renders both CTA buttons", () => {
      render(<TechnologyShowcase />);
      const buttons = screen.getAllByRole("link");
      const ctaButtons = buttons.filter(
        (btn) =>
          btn.textContent?.includes("Security Documentation") ||
          btn.textContent?.includes("How It Works")
      );
      expect(ctaButtons.length).toBeGreaterThanOrEqual(2);
    });

    it("CTA buttons have icons", () => {
      render(<TechnologyShowcase />);
      const securityButton = screen.getByRole("link", {
        name: /Security Documentation/i,
      });
      const howItWorksButton = screen.getByRole("link", {
        name: /How It Works/i,
      });

      expect(within(securityButton).getByRole("img", { hidden: true })).toBeInTheDocument();
      expect(within(howItWorksButton).getByRole("img", { hidden: true })).toBeInTheDocument();
    });
  });

  describe("Default Data", () => {
    it("DEFAULT_TECHNOLOGIES has 3 items", () => {
      expect(DEFAULT_TECHNOLOGIES).toHaveLength(3);
    });

    it("each default technology has required fields", () => {
      DEFAULT_TECHNOLOGIES.forEach((tech) => {
        expect(tech.id).toBeTruthy();
        expect(tech.icon).toBeTruthy();
        expect(tech.name).toBeTruthy();
        expect(tech.description).toBeTruthy();
        expect(tech.why).toBeTruthy();
        expect(tech.link).toBeTruthy();
      });
    });

    it("default technologies have unique IDs", () => {
      const ids = DEFAULT_TECHNOLOGIES.map((tech) => tech.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("default technologies include expected names", () => {
      const names = DEFAULT_TECHNOLOGIES.map((tech) => tech.name);
      expect(names).toContain("ML-KEM-768 (Kyber)");
      expect(names).toContain("Triple Ratchet Protocol");
      expect(names).toContain("WebRTC DataChannels");
    });
  });

  describe("Empty State", () => {
    it("handles empty technologies array gracefully", () => {
      const { container } = render(<TechnologyShowcase technologies={[]} />);
      const grid = container.querySelector('[role="list"]');
      expect(grid?.children).toHaveLength(0);
    });
  });

  describe("Responsive Behavior", () => {
    it("each card has full height", () => {
      const { container } = render(<TechnologyShowcase />);
      const cards = container.querySelectorAll('[role="article"]');
      cards.forEach((card) => {
        expect(card.parentElement).toHaveClass("h-full");
      });
    });

    it("applies larger padding on desktop", () => {
      const { container } = render(<TechnologyShowcase />);
      const firstCard = container.querySelector('[role="article"] > div');
      expect(firstCard).toHaveClass("lg:p-10");
    });
  });

  describe("TypeScript Types", () => {
    it("accepts Technology interface correctly", () => {
      const validTech: Technology = {
        id: "valid",
        icon: "Shield",
        name: "Test Tech",
        description: "Test Description",
        why: "Test Why",
        link: "/test",
      };

      expect(() =>
        render(<TechnologyShowcase technologies={[validTech]} />)
      ).not.toThrow();
    });
  });

  describe("Interaction", () => {
    it("learn more links have hover effects", () => {
      const { container } = render(<TechnologyShowcase />);
      const links = container.querySelectorAll('a[class*="group"]');
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        expect(link).toHaveClass("group");
      });
    });

    it("arrows have transition classes", () => {
      const { container } = render(<TechnologyShowcase />);
      const arrows = container.querySelectorAll(
        'a[class*="group"] svg[class*="transition"]'
      );
      expect(arrows.length).toBeGreaterThan(0);
    });
  });
});
