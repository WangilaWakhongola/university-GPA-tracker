"""
Authentication routes: register, login, logout, profile
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from database import db, User
from utils.gpa import REGIONS, region_to_scale

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    required = ["username", "email", "password", "full_name", "region"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    scale = region_to_scale(data["region"])
    if scale is None:
        return jsonify({
            "error": "Unsupported region. We don't have a grading scale for that region yet.",
            "supported_regions": REGIONS,
        }), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already taken"}), 409

    user = User(
        username      = data["username"],
        email         = data["email"],
        full_name     = data["full_name"],
        university    = data.get("university", ""),
        program       = data.get("program", ""),
        region        = data["region"],
        grading_scale = scale,  # always derived from region, never taken from client input
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get("email", "")).first()

    if not user or not user.check_password(data.get("password", "")):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    for field in ["full_name", "university", "program"]:
        if field in data:
            setattr(user, field, data[field])

    # grading_scale is never accepted directly — it's always derived from region,
    # so a student can't end up on a scale that doesn't match their region.
    if "region" in data:
        scale = region_to_scale(data["region"])
        if scale is None:
            return jsonify({
                "error": "Unsupported region. We don't have a grading scale for that region yet.",
                "supported_regions": REGIONS,
            }), 400
        user.region = data["region"]
        user.grading_scale = scale

    if "password" in data and data["password"]:
        user.set_password(data["password"])

    db.session.commit()
    return jsonify(user.to_dict()), 200


@auth_bp.route("/regions", methods=["GET"])
def list_regions():
    """Public: list supported regions and the scale each one maps to."""
    return jsonify(REGIONS), 200
