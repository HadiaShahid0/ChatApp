const SearchBar = ({ search, setSearch }) => {
  return (
    <div className="p-3 border-bottom bg-white">

      <input
        className="form-control"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

    </div>
  );
};

export default SearchBar;