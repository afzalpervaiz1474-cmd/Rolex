import { cloneElement, type ReactElement } from 'react';
import { useParams } from 'react-router-dom';

/** Remounts the child whenever the given route param changes, resetting its local state. */
export default function KeyedRoute({ param, children }: { param: string; children: ReactElement }) {
  const params = useParams();
  return cloneElement(children, { key: params[param] ?? '__none' });
}
