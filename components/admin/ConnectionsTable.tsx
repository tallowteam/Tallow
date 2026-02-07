'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ChevronUp, ChevronDown } from '@/components/icons';
import styles from './ConnectionsTable.module.css';

export interface Connection {
  id: string;
  peerId: string;
  peerName: string;
  type: 'local' | 'internet' | 'friend';
  connectedSince: number;
  bytesTransferred: number;
  status: 'connected' | 'idle' | 'transferring';
}

export interface ConnectionsTableProps {
  connections: Connection[];
}

type SortField = 'peerName' | 'type' | 'connectedSince' | 'bytesTransferred' | 'status';
type SortDirection = 'asc' | 'desc';

export function ConnectionsTable({ connections }: ConnectionsTableProps) {
  const [sortField, setSortField] = useState<SortField>('connectedSince');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedConnections = useMemo(() => {
    return [...connections].sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];

      if (sortField === 'peerName') {
        aVal = a.peerName.toLowerCase();
        bVal = b.peerName.toLowerCase();
      }

      if (aVal < bVal) {return sortDirection === 'asc' ? -1 : 1;}
      if (aVal > bVal) {return sortDirection === 'asc' ? 1 : -1;}
      return 0;
    });
  }, [connections, sortField, sortDirection]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {return `${days}d ${hours % 24}h`;}
    if (hours > 0) {return `${hours}h ${minutes % 60}m`;}
    if (minutes > 0) {return `${minutes}m ${seconds % 60}s`;}
    return `${seconds}s`;
  };

  const getStatusVariant = (
    status: Connection['status']
  ): 'success' | 'warning' | 'secondary' => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'transferring':
        return 'warning';
      case 'idle':
        return 'secondary';
    }
  };

  const getTypeLabel = (type: Connection['type']): string => {
    switch (type) {
      case 'local':
        return 'Local';
      case 'internet':
        return 'Internet';
      case 'friend':
        return 'Friend';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className={styles.sortIconInactive} />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className={styles.sortIcon} />
    ) : (
      <ChevronDown className={styles.sortIcon} />
    );
  };

  if (connections.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No active connections</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>
              <button
                className={styles.sortButton}
                onClick={() => handleSort('peerName')}
                aria-label="Sort by peer name"
              >
                Peer
                <SortIcon field="peerName" />
              </button>
            </th>
            <th>
              <button
                className={styles.sortButton}
                onClick={() => handleSort('type')}
                aria-label="Sort by type"
              >
                Type
                <SortIcon field="type" />
              </button>
            </th>
            <th>
              <button
                className={styles.sortButton}
                onClick={() => handleSort('connectedSince')}
                aria-label="Sort by duration"
              >
                Duration
                <SortIcon field="connectedSince" />
              </button>
            </th>
            <th>
              <button
                className={styles.sortButton}
                onClick={() => handleSort('bytesTransferred')}
                aria-label="Sort by bytes transferred"
              >
                Bytes
                <SortIcon field="bytesTransferred" />
              </button>
            </th>
            <th>
              <button
                className={styles.sortButton}
                onClick={() => handleSort('status')}
                aria-label="Sort by status"
              >
                Status
                <SortIcon field="status" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedConnections.map((connection) => (
            <tr key={connection.id}>
              <td>
                <div className={styles.peerCell}>
                  <div className={styles.peerName}>{connection.peerName}</div>
                  <div className={styles.peerId}>{connection.peerId}</div>
                </div>
              </td>
              <td>
                <Badge variant="secondary">{getTypeLabel(connection.type)}</Badge>
              </td>
              <td className={styles.durationCell}>{formatDuration(connection.connectedSince)}</td>
              <td className={styles.bytesCell}>{formatBytes(connection.bytesTransferred)}</td>
              <td>
                <Badge variant={getStatusVariant(connection.status)}>
                  {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
