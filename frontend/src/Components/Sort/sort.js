import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import StarRating from '../SearchBar/starrating';

function SortableList(){
    const [items, setItems] = useState([]);
    const [sortBy, setSortBy] = useState('starRating'); //Default sorting by star rating

    useEffect(() => {
        Axios.get('https://localhost:3001/workers')
        .then((response) => {
            setItems(response.data);
        }).catch((error) => {
            console.log('Error fetching data', error);
        })
    }, [])

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

     // Sorting function for name (A-Z)
    const sortByName = (a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    };

    // Sorting function for starRating (high to low)
    const sortByStarRating = (a, b) => b.starRating - a.starRating;

    const sortedItems = [...items].sort(
    sortBy === 'name' ? sortByName : sortByStarRating
    );

    return (
        <div>
          <label>
            Sort By:
            <select value={sortBy} onChange={handleSortChange}>
              <option value="starRating">Star Rating (High to Low)</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </label>
          <ul>
            {sortedItems.map((item, index) => (
              <li key={index}>
                {item.name} - {item.starRating} stars
              </li>
            ))}
          </ul>
        </div>
    );
}

export default SortableList