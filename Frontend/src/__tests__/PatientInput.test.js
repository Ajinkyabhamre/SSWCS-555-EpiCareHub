import React from "react";
import { render, screen } from "@testing-library/react";
import PatientInput from "../components/PatientInput";

jest.mock("axios");

describe("PatientInput component", () => {
  test("renders PatientInput component", () => {
    render(<PatientInput />);

    expect(screen.getByText("Patient Information Form")).toBeInTheDocument();
  });
  test("form fields render correctly", () => {
    render(<PatientInput />);

    expect(
      screen.getByRole("textbox", { name: "First Name" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Last Name" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Address" })
    ).toBeInTheDocument();
  });
});
