import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from '../components/Home.jsx';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

describe("Home component", () => {
  it("renders main headline", () => {
    render(<MemoryRouter><Home /></MemoryRouter>);

    // Check if the main headline is rendered
    expect(screen.getByText(/pinpoint seizure sources with confidence/i)).toBeInTheDocument();
  });

  it("renders feature cards", () => {
    render(<MemoryRouter><Home /></MemoryRouter>);

    // Check if feature cards are rendered
    expect(screen.getByText(/What EpiCareHub helps you do/i)).toBeInTheDocument();
  });

  it("renders how it works section", () => {
    render(<MemoryRouter><Home /></MemoryRouter>);

    // Check if the how it works section is rendered
    expect(screen.getByText(/How it works/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload EEG Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Run Localization/i)).toBeInTheDocument();
    expect(screen.getByText(/Review & Plan/i)).toBeInTheDocument();
  });

  it("renders CTA buttons", () => {
    render(<MemoryRouter><Home /></MemoryRouter>);

    // Check if the CTA buttons are rendered
    expect(screen.getByText(/Launch EpiCareHub/i)).toBeInTheDocument();
    expect(screen.getByText(/Explore Dashboard/i)).toBeInTheDocument();
  });

  it("renders brain illustration with correct alt text", () => {
    render(<MemoryRouter><Home /></MemoryRouter>);

    // Check if the image is rendered
    const image = screen.getByAltText(/eeg-based 3d brain localization illustration/i);
    expect(image).toBeInTheDocument();

    // Check if the image source is correct
    expect(image).toHaveAttribute("src", "/assets/homePhoto.svg");
  });
});
