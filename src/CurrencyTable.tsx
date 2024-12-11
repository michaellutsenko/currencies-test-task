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
  updateCurrencyRate: (currencyId: string, value: number) => void;
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

  return {
    data,
    error,
    updateCurrencyRate: (currencyId, value) => {
      const newData = { ...data } as CurrencyRateResponse;
      newData.rates[currencyId].value = value;
      setData(newData);
    },
  };
}

export function CurrencyTable() {
  const { data, error, updateCurrencyRate } = useCurrencyRates();

  if (error) {
    return <p>{error.message}</p>;
  }

  if (!data) {
    return <p>Loading...</p>;
  }

  return (
    <>
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
                  <td>
                    <EditableCurrencyRateValue
                      currencyId={id}
                      value={rate.value}
                      onSubmitNewValue={updateCurrencyRate}
                    />
                  </td>
                  <td>{rate.type}</td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </>
  );
}

function EditableCurrencyRateValue({
  currencyId,
  value,
  onSubmitNewValue,
}: {
  currencyId: string;
  value: number;
  onSubmitNewValue: (currencyId: string, value: number) => void;
}) {
  const [edit, setEdit] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  if (edit) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitNewValue(currencyId, inputValue);
          setEdit(false);
        }}
      >
        <input
          name="value"
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(Number(e.target.value))}
        />
        <button type="submit">Save</button>
        <button
          type="button"
          onClick={() => {
            setEdit(false);
            setInputValue(value);
          }}
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <>
      <span>{value}</span>
      <button type="button" onClick={() => setEdit(true)}>
        Edit
      </button>
    </>
  );
}
