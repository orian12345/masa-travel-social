function drawBarChart(containerId, data) {
  const width = 640;
  const height = 320;
  const margin = { top: 20, right: 20, bottom: 60, left: 40 };

  const svg = d3
    .select(containerId)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.label))
    .range([margin.left, width - margin.right])
    .padding(0.3);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) || 1])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end');

  svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5));

  svg
    .selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', (d) => x(d.label))
    .attr('y', (d) => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', (d) => y(0) - y(d.value))
    .attr('fill', 'oklch(66% 0.09 235)')
    .attr('rx', 6);
}

$(function () {
  $.get('/api/stats/posts-per-group', function (data) {
    if (!data.length) {
      $('#chart-posts-per-group').html('<p class="muted">אין עדיין נתונים להצגה.</p>');
      return;
    }
    drawBarChart('#chart-posts-per-group', data);
  });

  $.get('/api/stats/posts-per-month', function (data) {
    if (!data.length) {
      $('#chart-posts-per-month').html('<p class="muted">אין עדיין נתונים להצגה.</p>');
      return;
    }
    drawBarChart('#chart-posts-per-month', data);
  });
});
