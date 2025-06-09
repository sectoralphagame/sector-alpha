export class Probability2D {
  private cdf: number[];
  private width: number;
  offset: [number, number];

  constructor(array2D: number[][], offset: [number, number]) {
    this.width = array2D[0].length;
    this.offset = offset;

    const normalized = Probability2D.normalizeProbability2D(array2D);
    this.cdf = Probability2D.buildCDF2D(normalized);
  }

  sample(): [number, number] {
    const out = Probability2D.sampleFromCDF(this.cdf, this.width);
    out[0] += this.offset[0];
    out[1] += this.offset[1];

    return out;
  }

  static sampleFromCDF(cdf: number[], width: number): [number, number] {
    const r = Math.random();
    const index = cdf.findIndex((v) => v >= r);
    const x = index % width;
    const y = Math.floor(index / width);

    return [x, y];
  }

  static buildCDF2D(array2D: number[][]): number[] {
    const cdf: number[] = [];
    let sum = 0;
    for (const row of array2D)
      for (const p of row) {
        sum += p;
        cdf.push(sum);
      }

    return cdf;
  }

  static normalizeProbability2D(array: number[][]): number[][] {
    let sum = 0;
    for (const row of array) for (const val of row) sum += val;
    return array.map((row) => row.map((val) => val / sum));
  }
}
