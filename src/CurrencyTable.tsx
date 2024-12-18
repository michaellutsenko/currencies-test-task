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
  // Normally, there would also be a request status state (loading, error, etc.)
  // but in this case we really don't care about the loading state.
  // Two state variables are quite enough to represent the whole intended state machine.
  // But then again, normally there would be something like react-query to handle these things
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

    // Guaranteed to fire at least once in strict mode
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
      <table id="currency-table" aria-describedby="top-heading">
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
                  <td className="currency-value">
                    <EditableCurrencyRateValue
                      currencyId={id}
                      value={rate.value}
                      onSubmitNewValue={updateCurrencyRate}
                    />
                  </td>
                  <td>{toSentenceCase(rate.type)}</td>
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
      <div className="editable-value-container">
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
          <button type="submit" aria-label="Save changes">
            ✓
          </button>
          <button
            type="button"
            aria-label="Cancel changes"
            onClick={() => {
              setEdit(false);
              setInputValue(value);
            }}
          >
            ✕
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="editable-value-container">
      <span>{value}</span>
      <button
        type="button"
        aria-label="Edit value"
        onClick={() => setEdit(true)}
      >
        &#x270e;
      </button>
    </div>
  );
}

function toSentenceCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
