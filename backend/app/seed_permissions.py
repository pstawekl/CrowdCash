from app.core.database import SessionLocal
from app.models import Permission, Role, User

# Lista wszystkich uprawnień używanych w aplikacji
permissions = [
    "view_investor_dashboard",
    "view_feed",
    "view_investments",
    "view_transactions",
    "view_dashboard",
    "view_profile",
    "logout",
    "manage_campaigns",
    "view_notifications"
]

# Role i ich uprawnienia
roles_permissions = {
    "investor": [
        "view_investor_dashboard",
        "view_feed",
        "view_investments",
        "view_transactions",
        "view_profile",
        "logout"
    ],
    "entrepreneur": [
        "view_dashboard",
        "view_investments",
        "view_transactions",
        "view_profile",
        "logout"
    ],
    "admin": [
        "view_investor_dashboard",
        "view_feed",
        "view_investments",
        "view_transactions",
        "view_dashboard",
        "view_profile",
        "view_notifications",
        "logout",
        "manage_campaigns"
    ]
}

def seed_permissions():
    db = SessionLocal()

    try:
        # Dodaj permissions
        for perm_name in permissions:
            existing = db.query(Permission).filter(Permission.name == perm_name).first()
            if not existing:
                perm = Permission(name=perm_name)
                db.add(perm)
                print(f"Dodano permission: {perm_name}")

        # Dodaj role i przypisz permissions
        for role_name, role_permissions in roles_permissions.items():
            existing_role = db.query(Role).filter(Role.name == role_name).first()
            if not existing_role:
                role = Role(name=role_name)
                db.add(role)
                db.flush()  # żeby dostać ID

                # Dodaj permissions do roli
                for perm_name in role_permissions:
                    perm = db.query(Permission).filter(Permission.name == perm_name).first()
                    if perm:
                        role.permissions.append(perm)

                print(f"Dodano role: {role_name} z permissions: {role_permissions}")
            else:
                print(f"Role {role_name} już istnieje")

        db.commit()
        print("Seed permissions completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding permissions: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_permissions()
