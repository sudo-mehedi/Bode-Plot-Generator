document.addEventListener("DOMContentLoaded", function () {

  const hsLatex = `H(s) = \frac{N(s)}{D(s)}`;
  const numeratorLatex = `s^2 + 0.5s + 1`;
  const denominatorLatex = `s^3 + 2s^2 + 3s + 4`;
  katex.render(hsLatex, document.getElementById("latex-hs"));
  katex.render(numeratorLatex, document.getElementById("latex-numerator"));
  katex.render(denominatorLatex, document.getElementById("latex-denominator"));

  const hsElement = document.getElementById("latex-hs");
  katex.render(hsLatex, hsElement);
});

function plotBode() {
  const numeratorInput = document.getElementById("numerator").value;
  const denominatorInput = document.getElementById("denominator").value;

  const numerator = numeratorInput.split(",").map(parseFloat);
  const denominator = denominatorInput.split(",").map(parseFloat);

  if (
    !numerator ||
    !denominator ||
    numerator.some(isNaN) ||
    denominator.some(isNaN)
  ) {
    alert("Please enter valid coefficients.");
    return;
  }

  const omega = Array.from({ length: 500 }, (_, i) =>
    Math.pow(10, i / 100 - 1)
  ); // Log-scale frequencies

  const magnitude = omega.map((w) => {
    const jw = { real: 0, imag: w };
    const numEval = evaluatePolynomial(numerator, jw);
    const denEval = evaluatePolynomial(denominator, jw);
    const gain = divideComplex(numEval, denEval);
    return 20 * Math.log10(complexMagnitude(gain));
  });

  const phase = omega.map((w) => {
    const jw = { real: 0, imag: w };
    const numEval = evaluatePolynomial(numerator, jw);
    const denEval = evaluatePolynomial(denominator, jw);
    const gain = divideComplex(numEval, denEval);
    return (180 / Math.PI) * Math.atan2(gain.imag, gain.real);
  });

  drawPlot(
    document.getElementById("magnitude-plot"),
    omega,
    magnitude,
    "Magnitude (dB)",
    "Frequency (rad/s)",
    "Magnitude (dB)"
  );
  drawPlot(
    document.getElementById("phase-plot"),
    omega,
    phase,
    "Phase (degrees)",
    "Frequency (rad/s)",
    "Phase (°)"
  );
}

function evaluatePolynomial(coefficients, jw) {
  return coefficients.reduce(
    (sum, coeff, i) => {
      const term = multiplyComplex(
        { real: coeff, imag: 0 },
        powerComplex(jw, i)
      );
      return addComplex(sum, term);
    },
    { real: 0, imag: 0 }
  );
}

function complexMagnitude(c) {
  return Math.sqrt(c.real ** 2 + c.imag ** 2);
}

function addComplex(a, b) {
  return { real: a.real + b.real, imag: a.imag + b.imag };
}

function multiplyComplex(a, b) {
  return {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real,
  };
}

function divideComplex(a, b) {
  const denominator = b.real ** 2 + b.imag ** 2;
  return {
    real: (a.real * b.real + a.imag * b.imag) / denominator,
    imag: (a.imag * b.real - a.real * b.imag) / denominator,
  };
}

// I will import this later
function powerComplex(c, n) {
  if (n === 0) return { real: 1, imag: 0 };
  if (n === 1) return c;
  return multiplyComplex(c, powerComplex(c, n - 1));
}

function drawPlot(canvas, xData, yData, title, xLabel, yLabel) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 50;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;

  const xMin = Math.min(...xData);
  const xMax = Math.max(...xData);
  const yMin = Math.min(...yData);
  const yMax = Math.max(...yData);

  ctx.save();
  ctx.translate(padding, padding);

  // Draw axes
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, height);
  ctx.lineTo(width, height);
  ctx.strokeStyle = "black";
  ctx.stroke();

  // Add labels for axes
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(xLabel, width / 2, height + 35);
  ctx.save();
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, -height / 2, -35);
  ctx.restore();

  // Plot data
  ctx.beginPath();
  xData.forEach((x, i) => {
    const px =
      ((Math.log10(x) - Math.log10(xMin)) /
        (Math.log10(xMax) - Math.log10(xMin))) *
      width;
    const py = height - ((yData[i] - yMin) / (yMax - yMin)) * height;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = "blue";
  ctx.stroke();

  ctx.restore();
}
