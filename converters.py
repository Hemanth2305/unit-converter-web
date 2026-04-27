def convert(value, unit_from, unit_to, category):

    try:
        value = float(value)
    except (ValueError, TypeError):
        return None

    if unit_from == unit_to:
        return round(value, 4)

    if category == "temperature":
        if unit_from not in ["Celsius", "Fahrenheit"] or unit_to not in [
            "Celsius",
            "Fahrenheit",
        ]:
            return None

        # Convert to Celsius
        if unit_from == "Fahrenheit":
            value = (value - 32) * 5 / 9

        # Convert to target
        if unit_to == "Fahrenheit":
            value = (value * 9 / 5) + 32

        return round(value, 2)

    ratios = {
        "distance": {"Meters": 1, "Kilometers": 1000, "Miles": 1609.34, "Feet": 0.3048},
        "weight": {"Grams": 1, "Kilograms": 1000, "Pounds": 453.592, "Ounces": 28.3495},
    }

    if category not in ratios:
        return None

    category_map = ratios[category]

    if unit_from not in category_map or unit_to not in category_map:
        return None

    base_value = value * category_map[unit_from]
    result = base_value / category_map[unit_to]

    return round(result, 4)
