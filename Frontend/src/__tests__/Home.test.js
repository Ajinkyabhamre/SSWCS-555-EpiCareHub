import React from "react";
import { render, screen } from "@testing-library/react";
import Home from '../components/Home.jsx';

describe("Home component", () => {
  it("renders welcome message and description", () => {
    render(<Home />);

    // Check if the welcome message is rendered
    expect(screen.getByText(/welcome to the presurgical epilepsy evaluation platform/i)).toBeInTheDocument();

    // Check if the description is rendered
    expect(screen.getByText(/this web application platform is designed to assist doctors in accurately locating epileptic seizure areas in epilepsy patients' brains/i)).toBeInTheDocument();

    // Check if the paragraph with the text-gray-700 class is rendered
    expect(screen.getByText(/by utilizing advanced 3d visualization techniques, doctors can interact with reconstructed brain models, enabling them to pinpoint areas of abnormal brain activity associated with epilepsy/i)).toBeInTheDocument();
  });

  it("renders image with alt text", () => {
    render(<Home />);

    // Check if the image is rendered
    const image = screen.getByAltText("home");
    expect(image).toBeInTheDocument();

    // Check if the image source is correct
    expect(image).toHaveAttribute("src", "./public/assets/homePhoto.svg");

    // Check if the image has the correct class
    expect(image).toHaveClass("w-full", "md:w-auto", "max-h-96");
  });
});
