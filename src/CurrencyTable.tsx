import { useEffect, useState } from 'react';

interface CurrencyRate {
  name: string;
  unit: string;
  value: number;
  type: 'fiat' | 'crypto';
}

interface CurrencyRateResponse {
  rates: {
    [key: string]: CurrencyRate;
  };
}

function useCurrencyRates(): {
  data: CurrencyRateResponse | null;
  error: Error | null;
} {
  const [data, setData] = useState<CurrencyRateResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchCurrencyRates = async () => {
      setError(null);
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/exchange_rates',
          { signal: controller.signal }
        );
        const data = await response.json();
        setData(data);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setError(error as Error);
        }
      }
    };

    fetchCurrencyRates();

    return () => {
      controller.abort();
    };
  }, [setData, setError]);

  return { data, error };
}

export function CurrencyTable() {
  const { data, error } = useCurrencyRates();

  if (error) {
    return <p>{error.message}</p>;
  }

  if (!data) {
    return <p>Loading...</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Unit</th>
          <th>Value</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries((data as CurrencyRateResponse).rates).map(
          ([id, rate]) => {
            return (
              <tr key={id}>
                <td>{rate.name}</td>
                <td>{rate.unit}</td>
                <td>{rate.value}</td>
                <td>{rate.type}</td>
              </tr>
            );
          }
        )}
      </tbody>
    </table>
  );
}