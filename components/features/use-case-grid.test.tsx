/**
 * UseCaseGrid Component Tests
 *
 * Tests for the UseCaseGrid component including rendering,
 * accessibility, interactions, and responsive behavior.
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UseCaseGrid, UseCase, DEFAULT_USE_CASES } from "./use-case-grid";

describe("UseCaseGrid", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<UseCaseGrid />);
      expect(screen.getByRole("region")).toBeInTheDocument();
    });

    it("renders default use cases when no props provided", () => {
      render(<UseCaseGrid />);
      const cards = screen.getAllByRole("article");
      expect(cards).toHaveLength(DEFAULT_USE_CASES.length);
    });

    it("renders section header with correct text", () => {
      render(<UseCaseGrid />);
      expect(screen.getByText("Built for Everyone")).toBeInTheDocument();
      expect(
        screen.getByText(/See how Tallow empowers different professionals/i)
      ).toBeInTheDocument();
    });

    it("renders all default use case personas", () => {
      render(<UseCaseGrid />);
      expect(screen.getByText("Privacy Advocates")).toBeInTheDocument();
      expect(screen.getByText("Enterprise Teams")).toBeInTheDocument();
      expect(screen.getByText("Creative Professionals")).toBeInTheDocument();
      expect(screen.getByText("Healthcare Providers")).toBeInTheDocument();
      expect(screen.getByText("Legal Professionals")).toBeInTheDocument();
      expect(screen.getByText("Developers")).toBeInTheDocument();
    });

    it("renders custom use cases when provided", () => {
      const customUseCases: UseCase[] = [
        {
          id: "test-1",
          icon: "Code",
          persona: "Test Persona",
          scenario: "Test scenario description",
          features: ["Feature 1", "Feature 2"],
        },
      ];

      render(<UseCaseGrid useCases={customUseCases} />);
      expect(screen.getByText("Test Persona")).toBeInTheDocument();
      expect(screen.getByText("Test scenario description")).toBeInTheDocument();
      expect(screen.getByText("Feature 1")).toBeInTheDocument();
      expect(screen.getByText("Feature 2")).toBeInTheDocument();
    });

    it("renders icons for each use case", () => {
      render(<UseCaseGrid />);
      const cards = screen.getAllByRole("article");
      cards.forEach((card) => {
        const icon = within(card).getByRole("presentation", { hidden: true });
        expect(icon).toBeInTheDocument();
      });
    });

    it("renders all features for each use case", () => {
      const useCase: UseCase = {
        id: "test",
        icon: "Shield",
        persona: "Test User",
        scenario: "Test scenario",
        features: ["Feature A", "Feature B", "Feature C"],
      };

      render(<UseCaseGrid useCases={[useCase]} />);
      expect(screen.getByText("Feature A")).toBeInTheDocument();
      expect(screen.getByText("Feature B")).toBeInTheDocument();
      expect(screen.getByText("Feature C")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels on section", () => {
      render(<UseCaseGrid />);
      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("aria-labelledby", "use-cases-heading");
    });

    it("has proper heading structure", () => {
      render(<UseCaseGrid />);
      const mainHeading = screen.getByRole("heading", { level: 2 });
      expect(mainHeading).toHaveTextContent("Built for Everyone");
    });

    it("has unique IDs for each use case title", () => {
      render(<UseCaseGrid />);
      const cards = screen.getAllByRole("article");

      cards.forEach((card) => {
        const heading = within(card).getByRole("heading", { level: 3 });
        expect(heading).toHaveAttribute("id");
        expect(heading.id).toMatch(/^use-case-.*-title$/);
      });
    });

    it("has proper list semantics for features", () => {
      render(<UseCaseGrid />);
      const cards = screen.getAllByRole("article");

      cards.forEach((card) => {
        const featuresList = within(card).getByRole("list");
        expect(featuresList).toBeInTheDocument();
        expect(featuresList).toHaveAttribute("aria-label");
      });
    });

    it("has aria-hidden on decorative icons", () => {
      render(<UseCaseGrid />);
      const cards = screen.getAllByRole("article");

      cards.forEach((card) => {
        // The icon container has aria-hidden
        const iconContainer = card.querySelector('[aria-hidden="true"]');
        expect(iconContainer).toBeInTheDocument();
      });
    });
  });

  describe("Styling", () => {
    it("applies custom className when provided", () => {
      const { container } = render(
        <UseCaseGrid className="custom-class" />
      );
      const section = container.querySelector("section");
      expect(section).toHaveClass("custom-class");
    });

    it("has responsive grid classes", () => {
      const { container } = render(<UseCaseGrid />);
      const grid = container.querySelector('[role="list"]');
      expect(grid).toHaveClass("grid");
      expect(grid).toHaveClass("grid-cols-1"); // Mobile
      expect(grid).toHaveClass("md:grid-cols-2"); // Tablet
      expect(grid).toHaveClass("lg:grid-cols-3"); // Desktop
    });

    it("applies card-feature styling to cards", () => {
      const { container } = render(<UseCaseGrid />);
      const firstCard = container.querySelector('[role="article"] > div');
      expect(firstCard).toHaveClass("card-feature");
    });
  });

  describe("Content Validation", () => {
    it("renders scenario descriptions", () => {
      render(<UseCaseGrid />);
      expect(
        screen.getByText(/Journalist protecting sources/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Marketing team sharing campaign assets/i)
      ).toBeInTheDocument();
    });

    it("displays 'Key Features' label for each card", () => {
      const { container } = render(<UseCaseGrid />);
      const labels = container.querySelectorAll(".label-lg");
      expect(labels.length).toBeGreaterThan(0);
    });

    it("renders checkmark icons for features", () => {
      const { container } = render(<UseCaseGrid />);
      const checkIcons = container.querySelectorAll(
        'svg[class*="size-4"][class*="text-primary"]'
      );
      expect(checkIcons.length).toBeGreaterThan(0);
    });
  });

  describe("Default Data", () => {
    it("DEFAULT_USE_CASES has 6 items", () => {
      expect(DEFAULT_USE_CASES).toHaveLength(6);
    });

    it("each default use case has required fields", () => {
      DEFAULT_USE_CASES.forEach((useCase) => {
        expect(useCase.id).toBeTruthy();
        expect(useCase.icon).toBeTruthy();
        expect(useCase.persona).toBeTruthy();
        expect(useCase.scenario).toBeTruthy();
        expect(useCase.features).toBeInstanceOf(Array);
        expect(useCase.features.length).toBeGreaterThan(0);
      });
    });

    it("default use cases have unique IDs", () => {
      const ids = DEFAULT_USE_CASES.map((uc) => uc.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("default use cases include expected personas", () => {
      const personas = DEFAULT_USE_CASES.map((uc) => uc.persona);
      expect(personas).toContain("Privacy Advocates");
      expect(personas).toContain("Enterprise Teams");
      expect(personas).toContain("Creative Professionals");
      expect(personas).toContain("Healthcare Providers");
      expect(personas).toContain("Legal Professionals");
      expect(personas).toContain("Developers");
    });
  });

  describe("Empty State", () => {
    it("handles empty use cases array gracefully", () => {
      const { container } = render(<UseCaseGrid useCases={[]} />);
      const grid = container.querySelector('[role="list"]');
      expect(grid?.children).toHaveLength(0);
    });
  });

  describe("Responsive Behavior", () => {
    it("renders grid with proper gap classes", () => {
      const { container } = render(<UseCaseGrid />);
      const grid = container.querySelector('[role="list"]');
      expect(grid).toHaveClass("gap-6");
    });

    it("each card has full height", () => {
      const { container } = render(<UseCaseGrid />);
      const cards = container.querySelectorAll('[role="article"]');
      cards.forEach((card) => {
        expect(card.parentElement).toHaveClass("h-full");
      });
    });
  });

  describe("TypeScript Types", () => {
    it("accepts UseCase interface correctly", () => {
      const validUseCase: UseCase = {
        id: "valid",
        icon: "Shield",
        persona: "Test Persona",
        scenario: "Test Scenario",
        features: ["Feature 1"],
      };

      expect(() => render(<UseCaseGrid useCases={[validUseCase]} />)).not.toThrow();
    });
  });
});
