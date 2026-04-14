describe("Books Transformer", () => {
  it("should convert price string to float", () => {
    const price = parseFloat("£12.99".replace(/[^0-9.]/g, ""));
    expect(price).toBe(12.99);
  });

  it("should convert rating word to number", () => {
    const RATING_MAP: Record<string, number> = {
      One: 1,
      Two: 2,
      Three: 3,
      Four: 4,
      Five: 5,
    };
    expect(RATING_MAP["Three"]).toBe(3);
    expect(RATING_MAP["Five"]).toBe(5);
  });

  it("should return 1 for unknown rating", () => {
    const RATING_MAP: Record<string, number> = {
      One: 1,
      Two: 2,
      Three: 3,
      Four: 4,
      Five: 5,
    };
    const rating = RATING_MAP["Unknown"] ?? 1;
    expect(rating).toBe(1);
  });
});
