export async function pause(millis: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, millis);
  });
}
