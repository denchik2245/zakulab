<?php
declare(strict_types=1);

final class Store {
    private ?PDO $pdo = null;
    private bool $locked = false;
    public function __construct() {
        if (config()['driver'] === 'mysql') {
            $this->pdo = new PDO(config()['mysql_dsn'], config()['mysql_user'], config()['mysql_password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
            $this->pdo->exec('CREATE TABLE IF NOT EXISTS zakulab_entries (entry_key VARCHAR(190) PRIMARY KEY, payload LONGTEXT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
        } elseif (config()['driver'] !== 'file') throw new RuntimeException('Unknown storage driver');
    }
    private function filename(string $key): string {
        if (!preg_match('/^[a-z0-9-]{1,100}$/D', $key)) throw new RuntimeException('Invalid storage key');
        return storage_path('db/' . $key . '.json');
    }
    public function get(string $key, mixed $default = null): mixed {
        if (!$this->pdo) return read_json_file($this->filename($key), $default);
        $query = $this->pdo->prepare('SELECT payload FROM zakulab_entries WHERE entry_key = ?');
        $query->execute([$key]);
        $value = $query->fetchColumn();
        return $value === false ? $default : json_decode($value, true, 128, JSON_THROW_ON_ERROR);
    }
    public function set(string $key, mixed $value): void {
        if (!$this->locked) throw new RuntimeException('Writes require a transaction');
        $raw = json_encode_safe($value);
        if (!$this->pdo) { atomic_file($this->filename($key), $raw); return; }
        $query = $this->pdo->prepare('INSERT INTO zakulab_entries (entry_key,payload) VALUES (?,?) ON DUPLICATE KEY UPDATE payload = VALUES(payload)');
        $query->execute([$key, $raw]);
    }
    public function transaction(callable $callback): mixed {
        if ($this->locked) return $callback($this);
        if ($this->pdo) {
            // One short lock across CMS saves, submissions and cache publication; all instances share it.
            $name = 'zakulab-' . substr(hash('sha256', config()['mysql_dsn']), 0, 40);
            $query = $this->pdo->prepare('SELECT GET_LOCK(?, 5)');
            $query->execute([$name]);
            if ((int)$query->fetchColumn() !== 1) throw new RuntimeException('Storage is busy');
            $this->pdo->beginTransaction();
            $this->locked = true;
            try { $result = $callback($this); $this->pdo->commit(); return $result; }
            catch (Throwable $error) { if ($this->pdo->inTransaction()) $this->pdo->rollBack(); throw $error; }
            finally { $this->locked = false; $query = $this->pdo->prepare('SELECT RELEASE_LOCK(?)'); $query->execute([$name]); }
        }
        $lock = fopen(storage_path('.write.lock'), 'c');
        if (!$lock || !flock($lock, LOCK_EX)) throw new RuntimeException('Storage is busy');
        $this->locked = true;
        try { return $callback($this); }
        finally { $this->locked = false; flock($lock, LOCK_UN); fclose($lock); }
    }
}
function store(): Store { static $store; return $store ??= new Store(); }
