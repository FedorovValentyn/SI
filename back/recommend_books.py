import pickle
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import sys
import json

# Завантаження моделі
model_path = './model1.pkl'
with open(model_path, 'rb') as f:
    model = pickle.load(f)

df = model['dataframe']

# Переконатися, що опис — це рядок
df['description'] = df['description'].apply(lambda x: str(x) if isinstance(x, str) else '')

vectorizer = TfidfVectorizer(stop_words='english')
tfidf_matrix = vectorizer.fit_transform(df['description'])
df['textual_representation'] = list(tfidf_matrix.toarray())

def recommend_book(book_name):
    try:
        selected_book = df[df['title'].str.contains(book_name, case=False)].iloc[0]
        vector = selected_book['textual_representation']
        vectors = df['textual_representation'].tolist()

        similarity = cosine_similarity([vector], vectors)[0]
        similar_indices = np.argsort(-similarity)[1:5]

        recommendations = df.iloc[similar_indices]

        # Convert recommendations to a JSON serializable format
        recommendations_list = recommendations.to_dict(orient='records')

        # Ensure all 'textual_representation' fields are converted from numpy arrays to lists
        for recommendation in recommendations_list:
            if isinstance(recommendation['textual_representation'], np.ndarray):
                recommendation['textual_representation'] = recommendation['textual_representation'].tolist()

            # Sanitize NaN values and replace them with None (JSON null)
            for key, value in recommendation.items():
                if isinstance(value, float) and (np.isnan(value) or value != value):  # Check for NaN
                    recommendation[key] = None  # Replace NaN with None

        return recommendations_list
    except IndexError:
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Book name argument missing"}))
        sys.exit(1)

    book_name = sys.argv[1]
    recommendations = recommend_book(book_name)

    if recommendations is None:
        print(json.dumps({"error": "Book not found"}))
        sys.exit(1)

    # Print the recommendations in JSON format
    print(json.dumps(recommendations, ensure_ascii=False))
