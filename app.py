from flask import Flask, request, jsonify, render_template
from converters import convert

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/convert", methods=["POST"])
def handle_conversion():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        value = data.get("value")
        unit_from = data.get("unit_from")
        unit_to = data.get("unit_to")
        category = data.get("category")

        if value is None or unit_from is None or unit_to is None or category is None:
            return jsonify({"error": "Missing required fields"}), 400

        result = convert(
            value=value, unit_from=unit_from, unit_to=unit_to, category=category
        )

        return jsonify({"result": result, "success": True})

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Conversion failed", "success": False}), 500


if __name__ == "__main__":
    app.run()
