import requests
import psycopg2
import pandas as pd
import bcrypt
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Database connection settings
DB_SETTINGS = {
    "host": "localhost",
    "database": "moviesdb",
    "user": "postgres",
    "password": "2004"
}

# TMDb API Key and Base URLs
TMDB_API_KEY = "b3eb1222fee62dfa74a275ab01a6d357"  # Replace with your TMDb API key
TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie"
TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500"



# Function to fetch movie poster from TMDb
def fetch_movie_poster(movie_title):
    try:
        response = requests.get(
            TMDB_SEARCH_URL,
            params={"api_key": TMDB_API_KEY, "query": movie_title}
        )
        response.raise_for_status()  # Raise an error for bad responses
        data = response.json()
        
        # Check if results exist
        if data["results"]:
            poster_path = data["results"][0].get("poster_path")
            return f"{TMDB_POSTER_BASE_URL}{poster_path}" if poster_path else None

        return None  # Return None if no poster is found
    except Exception as e:
        print(f"Error fetching poster for {movie_title}: {e}")
        return None

# Connect to the database and fetch movie data
def fetch_movies():
    try:
        conn = psycopg2.connect(**DB_SETTINGS)
        query = "SELECT movie_id, title, tags, overview FROM movies;"
        df = pd.read_sql_query(query, conn)
        conn.close()

        # Convert 'overview' to string for consistency
        df["overview"] = df["overview"].apply(
            lambda x: str(x or "Overview not available")
    )

        
        # Debugging: Ensure all overviews are strings
        print("Overview Data Type Check:", df["overview"].apply(type).unique())  # Should show <class 'str'>
        return df
    except Exception as e:
        print(f"Database error: {e}")
        return pd.DataFrame()  # Return empty DataFrame

  # Return empty DataFrame
 # Return empty DataFrame


# Generate recommendations
def get_recommendations(movie_title, movies_df):
    vectorizer = CountVectorizer(stop_words="english")
    count_matrix = vectorizer.fit_transform(movies_df["tags"])
    cosine_sim = cosine_similarity(count_matrix)

    try:
        idx = movies_df[movies_df["title"].str.lower() == movie_title.lower()].index[0]
    except IndexError:
        return {"error": "Movie not found in database."}

    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

    top_movies = []
    for i in sim_scores[1:11]:  # Get top 10 similar movies (skipping the first)
        movie_data = movies_df.iloc[i[0]]

        # Fetch poster from TMDb API
        poster_url = fetch_movie_poster(movie_data["title"]) or "https://via.placeholder.com/200x300.png?text=No+Image"

        # Append to top_movies within the loop
        top_movies.append({
            "title": movie_data["title"],
            "overview": movie_data["overview"],
            "image_url": poster_url
        })

    print(top_movies)  # Debugging: Check the list of top movies
    return {"recommendations": top_movies}

@app.route("/")
def login():
    return render_template("login.html")



@app.route("/index.html",methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    if not data or "movie" not in data:
        return jsonify({"error": "Missing movie title in request body."}), 400

    movie_title = data["movie"]
    movies_df = fetch_movies()
    result = get_recommendations(movie_title, movies_df)

    if "error" in result:
        return jsonify(result), 404

    return jsonify(result), 200

if __name__ == "__main__":
    app.run(debug=True)
