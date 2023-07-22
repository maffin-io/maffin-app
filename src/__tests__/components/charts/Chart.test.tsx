import React from 'react';
import { render, screen } from '@testing-library/react';
import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

import Chart from '@/components/charts/Chart';

jest.mock('next/dynamic', () => ({
  __esModule: true,
  // eslint-disable-next-line global-require
  default: () => require('react-apexcharts'),
}));

jest.mock('react-apexcharts', () => jest.fn(
  () => <div data-testid="Chart" />,
));
const ApexChartMock = ApexChart as jest.MockedFunction<typeof ApexChart>;

describe('Chart', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading if no data', () => {
    render(<Chart type="bar" />);

    screen.getByText('Loading...');
  });

  it('creates chart with expected parameters', () => {
    render(<Chart series={[1]} type="bar" />);

    expect(ApexChartMock).toHaveBeenCalledWith(
      {
        className: 'apex-charts',
        height: 400,
        options: {
          chart: {
            foreColor: '#94A3B8',
            id: '',
            toolbar: {
              show: false,
            },
            width: '100%',
            zoom: {
              autoScaleYaxis: true,
              enabled: true,
              type: 'x',
            },
            events: {
              mounted: expect.any(Function),
            },
          },
          dataLabels: {
            enabled: false,
          },
          grid: {
            borderColor: '#777f85',
          },
          labels: [],
          legend: {
            show: true,
          },
          plotOptions: {
            bar: {
              columnWidth: '55%',
              horizontal: false,
            },
          },
          stroke: {
            curve: 'smooth',
            dashArray: 0,
            width: 0,
          },
          title: {
            align: 'left',
            text: '',
          },
          tooltip: {
            fillSeriesColor: true,
            intersect: true,
            inverseOrder: true,
            shared: false,
            theme: 'dark',
            x: {
              show: false,
            },
            y: {
              formatter: expect.any(Function),
            },
          },
          xaxis: {
            axisBorder: {
              show: false,
            },
            categories: [],
            type: undefined,
          },
          yaxis: {
            labels: {
              formatter: expect.any(Function),
            },
          },
        },
        series: [1],
        type: 'bar',
        width: '100%',
      },
      {},
    );
  });

  it('hides series on mount', () => {
    render(<Chart hideSeries={['a', 'b']} series={[1]} type="bar" />);

    // @ts-ignore
    const options = ApexChartMock.mock.calls[0][0].options as ApexOptions;

    const mockHideSeries = jest.fn();
    const mockChart = {
      hideSeries: mockHideSeries,
    };

    // @ts-ignore
    options.chart.events.mounted(mockChart);

    expect(mockHideSeries).toBeCalledTimes(2);
    expect(mockHideSeries).toHaveBeenNthCalledWith(1, 'a');
    expect(mockHideSeries).toHaveBeenNthCalledWith(2, 'b');
  });

  it('sets optional params', () => {
    render(
      <Chart
        series={[1]}
        title="title"
        showLegend={false}
        xCategories={['a', 'b']}
        xAxisType="datetime"
        type="bar"
        unit="unit"
        height={200}
      />,
    );

    // @ts-ignore
    const options = ApexChartMock.mock.calls[0][0].options as ApexOptions;

    expect(options?.title?.text).toEqual('title');
    expect(options?.legend?.show).toEqual(false);
    expect(options?.xaxis?.categories).toEqual(['a', 'b']);
    // @ts-ignore
    expect(options?.yaxis?.labels.formatter(1)).toEqual('1 unit');
    // @ts-ignore
    expect(options?.tooltip?.y?.formatter(1)).toEqual('1 unit');

    // @ts-ignore
    expect(ApexChartMock.mock.calls[0][0].height).toEqual(200);
  });
});
