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

    // @ts-ignore
    const options = ApexChartMock.mock.calls[0][0].options as ApexOptions;
    // @ts-ignore
    expect(options?.yaxis?.labels.formatter(1)).toEqual('€1.00');
    // @ts-ignore
    expect(options?.tooltip?.y?.formatter(1)).toEqual('€1.00');
    expect(ApexChartMock).toHaveBeenCalledWith(
      {
        height: 400,
        options: {
          chart: {
            foreColor: '#94A3B8',
            toolbar: {
              show: false,
            },
            width: '100%',
            zoom: {
              autoScaleYaxis: true,
              enabled: true,
              type: 'x',
            },
          },
          dataLabels: {
            enabled: false,
            style: {
              colors: ['#DDDDDD'],
              fontFamily: 'Intervariable',
              fontWeight: '300',
              fontSize: '14px',
            },
            dropShadow: {
              enabled: false,
            },
          },
          grid: {
            borderColor: '#777f85',
          },
          states: {
            active: {
              allowMultipleDataPointsSelection: false,
              filter: {
                type: 'lighten',
                value: 0.5,
              },
            },
          },
          stroke: {
            curve: 'smooth',
            width: 0,
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

  it('merges params', () => {
    const mockYFormatter = jest.fn();
    const mockMounted = jest.fn();
    render(
      <Chart
        series={[1]}
        type="bar"
        unit="unit"
        height={200}
        options={{
          dataLabels: { enabled: true },
          plotOptions: {
            area: {
              fillTo: 'origin',
            },
          },
          chart: {
            events: {
              mounted: mockMounted,
            },
          },
          tooltip: {
            y: {
              formatter: mockYFormatter,
            },
          },
        }}
      />,
    );

    expect(ApexChartMock.mock.calls[0][0]).toMatchObject({
      options: {
        chart: {
          events: {
            mounted: mockMounted,
          },
        },
        tooltip: {
          y: {
            formatter: mockYFormatter,
          },
        },
        dataLabels: {
          enabled: true,
          style: {
            colors: ['#DDDDDD'],
            fontFamily: 'Intervariable',
            fontWeight: '300',
            fontSize: '14px',
          },
          dropShadow: {
            enabled: false,
          },
        },
        plotOptions: {
          area: {
            fillTo: 'origin',
          },
        },
      },
      height: 200,
    });
  });
});
