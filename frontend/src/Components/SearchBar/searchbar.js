import { useState } from "react";
//import StarRating from './starrating';
import './SearchBar.css';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, Link } from 'react-router-dom';

function SearchJobs({placeholder,data}) {
    const [filteredData, setFilteredData] = useState([]);
    const [wordEntered, setWordEntered] = useState("");

    const navigate = useNavigate()

    const handleChange = (event) => {
        const searchWord = event.target.value;
        setWordEntered(searchWord)
        const newFilter = data.filter((value) => {
            return value.occupation.toLowerCase().includes(searchWord);
        });
        if(searchWord === ""){
            setFilteredData([]);
            <h1>No search result</h1>
        }else{
            setFilteredData(newFilter)
        }
    }

    const clearInput = () => {
        setFilteredData([]);
        setWordEntered("");
      };

    return(
        <>
        <div className="searchbars">
            <div className= "searchbar">
            
            <div id="searchbar">
                <input type="search" id="search" placeholder={placeholder} onChange={handleChange} value={wordEntered}/>
                <div className="searchIcon">
                    {filteredData.length === 0 ? (
                    <SearchIcon />
                    ) : (
                        <CloseIcon id="clearBtn" onClick={clearInput} />
                    )}
                </div>
            </div>
            {filteredData.length !== 0 && (
            <div className="searchResults">
                {filteredData.map((value,key) => {
                    return( 
                        <div className="results">
                            <Link key={value.occupation} to={`/${value.occupation}`}>
                            <p>{value.occupation}</p>
                            </Link>
                            {/*<h2 id="word">Name: {value.name}</h2>*/}
                            {/*<h2>Rating: <StarRating /></h2>*/}
                        </div> 
                    );
                })}
            </div>
          )}
        </div>
    </div> 
    </>    
  )
}

export default SearchJobs
